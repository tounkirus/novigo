package com.novigo.auth;

import com.novigo.auth.dto.AuthDtos.*;
import com.novigo.auth.otp.OtpService;
import com.novigo.config.NovigoProperties;
import com.novigo.domain.identity.*;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/** Orchestration de l'authentification : register, login (mot de passe & OTP), refresh, logout. */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final RoleRepository roles;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwt;
    private final OtpService otp;
    private final NovigoProperties props;

    // ---------------------------------------------------------------- REGISTER
    @Transactional
    public TokenResponse register(RegisterRequest req) {
        boolean hasEmail = req.email() != null && !req.email().isBlank();
        boolean hasPhone = req.phone() != null && !req.phone().isBlank();
        if (!hasEmail && !hasPhone) {
            throw badRequest("Email ou téléphone requis.");
        }
        if (hasEmail && users.existsByEmailIgnoreCase(req.email())) {
            throw conflict("Cet email est déjà utilisé.");
        }
        if (hasPhone && users.existsByPhone(req.phone())) {
            throw conflict("Ce téléphone est déjà utilisé.");
        }
        User user = new User();
        user.setFullName(req.fullName());
        if (hasEmail) user.setEmail(req.email().toLowerCase());
        if (hasPhone) user.setPhone(req.phone());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.getRoles().add(defaultClientRole());
        users.save(user);
        return issueTokens(user);
    }

    // ---------------------------------------------------------------- LOGIN (password)
    @Transactional
    public TokenResponse login(LoginRequest req) {
        User user = resolveUser(req.identifier())
                .orElseThrow(() -> unauthorized("Identifiants invalides."));
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw unauthorized("Identifiants invalides.");
        }
        if (!"ACTIVE".equals(user.getStatus())) {
            throw unauthorized("Compte inactif.");
        }
        return issueTokens(user);
    }

    // ---------------------------------------------------------------- OTP
    @Transactional
    public OtpResponse requestOtp(OtpRequest req) {
        String channel = req.target().contains("@") ? "EMAIL" : "SMS";
        String code = otp.issue(req.target(), channel, "LOGIN");
        return new OtpResponse(
                req.target(), channel, props.getOtp().getTtlMinutes() * 60,
                props.isOtpDebugMode() ? code : null);
    }

    @Transactional
    public TokenResponse verifyOtp(OtpVerifyRequest req) {
        otp.verify(req.target(), "LOGIN", req.code());
        boolean isEmail = req.target().contains("@");
        User user = (isEmail
                ? users.findByEmailIgnoreCase(req.target())
                : users.findByPhone(req.target()))
                .orElseGet(() -> createOtpUser(req.target(), isEmail));
        // La vérification OTP confirme la propriété du canal.
        if (isEmail) user.setEmailVerified(true); else user.setPhoneVerified(true);
        users.save(user);
        return issueTokens(user);
    }

    // ---------------------------------------------------------------- REFRESH
    @Transactional
    public TokenResponse refresh(RefreshRequest req) {
        Claims claims;
        try {
            claims = jwt.parseRefresh(req.refreshToken());
        } catch (JwtException | IllegalArgumentException e) {
            throw unauthorized("Jeton de rafraîchissement invalide.");
        }
        if (!JwtService.TYPE_REFRESH.equals(claims.get("type", String.class))) {
            throw unauthorized("Type de jeton incorrect.");
        }
        String hash = Hashing.sha256(req.refreshToken());
        RefreshToken stored = refreshTokens.findByTokenHash(hash)
                .orElseThrow(() -> unauthorized("Jeton de rafraîchissement inconnu."));
        if (stored.isRevoked()) {
            throw unauthorized("Jeton de rafraîchissement révoqué.");
        }
        // Rotation : on révoque l'ancien et on émet une nouvelle paire.
        stored.setRevoked(true);
        refreshTokens.save(stored);
        return issueTokens(stored.getUser());
    }

    // ---------------------------------------------------------------- LOGOUT
    @Transactional
    public void logout(LogoutRequest req) {
        String hash = Hashing.sha256(req.refreshToken());
        refreshTokens.findByTokenHash(hash).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokens.save(rt);
        });
    }

    // ---------------------------------------------------------------- ME
    @Transactional(readOnly = true)
    public UserView me(UUID userId) {
        User user = users.findById(userId)
                .orElseThrow(() -> unauthorized("Session invalide."));
        return toView(user);
    }

    // ---------------------------------------------------------------- helpers
    private TokenResponse issueTokens(User user) {
        List<String> roleCodes = user.getRoles().stream().map(Role::getCode).toList();
        String access = jwt.issueAccessToken(user.getId(), user.getEmail(), roleCodes);
        String refresh = jwt.issueRefreshToken(user.getId());

        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setTokenHash(Hashing.sha256(refresh));
        rt.setExpiresAt(jwt.refreshExpiry());
        refreshTokens.save(rt);

        return new TokenResponse(access, refresh, "Bearer", jwt.accessTtlSeconds(), toView(user));
    }

    private java.util.Optional<User> resolveUser(String identifier) {
        return identifier.contains("@")
                ? users.findByEmailIgnoreCase(identifier)
                : users.findByPhone(identifier);
    }

    private User createOtpUser(String target, boolean isEmail) {
        User user = new User();
        if (isEmail) {
            user.setEmail(target.toLowerCase());
            user.setFullName(target.substring(0, target.indexOf('@')));
        } else {
            user.setPhone(target);
            user.setFullName("Utilisateur " + target);
        }
        user.getRoles().add(defaultClientRole());
        return users.save(user);
    }

    private Role defaultClientRole() {
        return roles.findByCode("CLIENT")
                .orElseThrow(() -> new IllegalStateException("Rôle CLIENT introuvable (seed manquant)."));
    }

    private UserView toView(User user) {
        return new UserView(
                user.getId(), user.getEmail(), user.getPhone(), user.getFullName(),
                user.getAvatarUrl(), user.getStatus(),
                user.getRoles().stream().map(Role::getCode).sorted().toList());
    }

    private ResponseStatusException badRequest(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    private ResponseStatusException conflict(String msg) {
        return new ResponseStatusException(HttpStatus.CONFLICT, msg);
    }

    private ResponseStatusException unauthorized(String msg) {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, msg);
    }
}

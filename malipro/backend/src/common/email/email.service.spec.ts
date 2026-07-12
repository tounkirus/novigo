import { EmailService } from "./email.service";
import { EMAIL_TEMPLATES } from "./email.templates";

describe("EmailService", () => {
  it("envoie un gabarit et journalise (EmailLog)", async () => {
    const transport = { deliver: jest.fn() } as any;
    const prisma = { emailLog: { create: jest.fn().mockResolvedValue({}) } } as any;
    const res = await new EmailService(transport, prisma).sendTemplate("a@b.ml", "welcome", { name: "Awa" });
    expect(transport.deliver).toHaveBeenCalled();
    expect(prisma.emailLog.create).toHaveBeenCalled();
    expect(res.status).toBe("SENT");
  });

  it("journalise un échec de transport", async () => {
    const transport = { deliver: jest.fn().mockRejectedValue(new Error("smtp down")) } as any;
    const prisma = { emailLog: { create: jest.fn().mockResolvedValue({}) } } as any;
    const res = await new EmailService(transport, prisma).sendTemplate("a@b.ml", "welcome", {});
    expect(res.status).toBe("FAILED");
  });

  it("rejette un gabarit inconnu", async () => {
    const svc = new EmailService({ deliver: jest.fn() } as any, { emailLog: { create: jest.fn() } } as any);
    await expect(svc.sendTemplate("a@b.ml", "inexistant", {})).rejects.toThrow();
  });
});

describe("EMAIL_TEMPLATES", () => {
  it("rend welcome et password-reset", () => {
    expect(EMAIL_TEMPLATES.welcome({ name: "X" }).subject).toContain("Bienvenue");
    expect(EMAIL_TEMPLATES["password-reset"]({ token: "abc123" }).html).toContain("abc123");
  });
});

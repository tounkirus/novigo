import { HttpSmsService } from "./http-sms.service";

const cfg = (map: Record<string, any> = {}) => ({ get: (k: string) => map[k] }) as any;
afterEach(() => { jest.restoreAllMocks(); delete (global as any).fetch; });

describe("HttpSmsService", () => {
  it("sans SMS_HTTP_URL -> n'envoie rien", async () => {
    const spy = jest.fn();
    (global as any).fetch = spy;
    await new HttpSmsService(cfg()).send("+22370", "code");
    expect(spy).not.toHaveBeenCalled();
  });

  it("avec URL + token -> POST authentifié", async () => {
    const f = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    (global as any).fetch = f;
    await new HttpSmsService(cfg({ SMS_HTTP_URL: "https://sms.test", SMS_HTTP_TOKEN: "tok" })).send("+22370", "code");
    expect(f).toHaveBeenCalledWith("https://sms.test", expect.objectContaining({ method: "POST" }));
    const opts = f.mock.calls[0][1];
    expect(opts.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(opts.body)).toEqual({ to: "+22370", message: "code" });
  });

  it("sans token -> pas d'en-tête Authorization", async () => {
    const f = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    (global as any).fetch = f;
    await new HttpSmsService(cfg({ SMS_HTTP_URL: "https://sms.test" })).send("+1", "m");
    expect(f.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("réponse non-OK -> journalise sans jeter", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(new HttpSmsService(cfg({ SMS_HTTP_URL: "https://sms.test" })).send("+1", "m")).resolves.toBeUndefined();
  });

  it("exception réseau -> avalée (pas de throw)", async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error("net"));
    await expect(new HttpSmsService(cfg({ SMS_HTTP_URL: "https://sms.test" })).send("+1", "m")).resolves.toBeUndefined();
  });
});

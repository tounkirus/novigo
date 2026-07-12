import { InfobipSmsService } from "./infobip-sms.service";
import { TwilioSmsService } from "./twilio-sms.service";
import { ConsoleSmsService } from "./sms.service";

const cfg = (map: Record<string, any> = {}) => ({ get: (k: string) => map[k] }) as any;
afterEach(() => { jest.restoreAllMocks(); delete (global as any).fetch; });

describe("InfobipSmsService", () => {
  const ok = { INFOBIP_BASE_URL: "https://infobip.test", INFOBIP_API_KEY: "key" };

  it("non configuré -> n'envoie rien", async () => {
    const f = jest.fn(); (global as any).fetch = f;
    await new InfobipSmsService(cfg()).send("+22370", "m");
    expect(f).not.toHaveBeenCalled();
  });

  it("configuré -> POST avec App key et destinataire sans +", async () => {
    const f = jest.fn().mockResolvedValue({ ok: true, status: 200 }); (global as any).fetch = f;
    await new InfobipSmsService(cfg(ok)).send("+22370", "code");
    expect(f).toHaveBeenCalledWith("https://infobip.test/sms/2/text/advanced", expect.objectContaining({ method: "POST" }));
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.messages[0].destinations[0].to).toBe("22370");
    expect(f.mock.calls[0][1].headers.Authorization).toBe("App key");
  });

  it("réponse non-OK et exception -> avalées", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 });
    await expect(new InfobipSmsService(cfg(ok)).send("+1", "m")).resolves.toBeUndefined();
    (global as any).fetch = jest.fn().mockRejectedValue(new Error("net"));
    await expect(new InfobipSmsService(cfg(ok)).send("+1", "m")).resolves.toBeUndefined();
  });
});

describe("TwilioSmsService", () => {
  const ok = { TWILIO_ACCOUNT_SID: "AC1", TWILIO_AUTH_TOKEN: "tok", TWILIO_FROM: "+100" };

  it("non configuré -> n'envoie rien", async () => {
    const f = jest.fn(); (global as any).fetch = f;
    await new TwilioSmsService(cfg({ TWILIO_ACCOUNT_SID: "AC1" })).send("+1", "m");
    expect(f).not.toHaveBeenCalled();
  });

  it("configuré -> POST Basic auth vers l'endpoint Messages", async () => {
    const f = jest.fn().mockResolvedValue({ ok: true, status: 201 }); (global as any).fetch = f;
    await new TwilioSmsService(cfg(ok)).send("+22370", "code");
    expect(f.mock.calls[0][0]).toBe("https://api.twilio.com/2010-04-01/Accounts/AC1/Messages.json");
    expect(f.mock.calls[0][1].headers.Authorization).toMatch(/^Basic /);
  });

  it("réponse non-OK et exception -> avalées", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });
    await expect(new TwilioSmsService(cfg(ok)).send("+1", "m")).resolves.toBeUndefined();
    (global as any).fetch = jest.fn().mockRejectedValue(new Error("net"));
    await expect(new TwilioSmsService(cfg(ok)).send("+1", "m")).resolves.toBeUndefined();
  });
});

describe("ConsoleSmsService", () => {
  it("send : journalise sans jeter", async () => {
    await expect(new ConsoleSmsService().send("+22370", "code")).resolves.toBeUndefined();
  });
});

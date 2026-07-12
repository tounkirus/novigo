import { NotFoundException } from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter", () => {
  it("produit une enveloppe d'erreur normalisée", () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as any;

    new HttpExceptionFilter().catch(new NotFoundException("Introuvable."), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { code: "NOT_FOUND", message: "Introuvable.", status: 404 },
    });
  });
});

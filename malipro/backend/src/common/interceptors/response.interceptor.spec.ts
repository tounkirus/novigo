import { of, lastValueFrom } from "rxjs";
import { ResponseInterceptor } from "./response.interceptor";

const call = (value: any) => {
  const interceptor = new ResponseInterceptor();
  return lastValueFrom(interceptor.intercept({} as any, { handle: () => of(value) } as any));
};

describe("ResponseInterceptor", () => {
  it("emballe une valeur simple", async () => {
    expect(await call({ id: 1 })).toEqual({ success: true, data: { id: 1 } });
  });

  it("préserve la forme paginée { data, meta }", async () => {
    const paginated = { data: [1, 2], meta: { page: 1 } };
    expect(await call(paginated)).toEqual({ success: true, data: [1, 2], meta: { page: 1 } });
  });

  it("normalise null en data:null", async () => {
    expect(await call(null)).toEqual({ success: true, data: null });
  });
});

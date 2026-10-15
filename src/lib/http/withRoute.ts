import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { z } from "zod";
import { ApiError } from "@/lib/errors";
import { touchLastActive } from "@/lib/touchLastActive";
import { guards, type GuardContext, type GuardName } from "@/lib/http/guards";

interface WithRouteOptions<Body extends z.ZodType | undefined, Query extends z.ZodType | undefined> {
  guard: GuardName;
  body?: Body;
  query?: Query;
}

type ParsedBody<Body extends z.ZodType | undefined> = Body extends z.ZodType ? z.infer<Body> : undefined;
type ParsedQuery<Query extends z.ZodType | undefined> = Query extends z.ZodType ? z.infer<Query> : undefined;

interface HandlerArgs<Body extends z.ZodType | undefined, Query extends z.ZodType | undefined> {
  req: NextRequest;
  ctx: GuardContext;
  body: ParsedBody<Body>;
  query: ParsedQuery<Query>;
  params: Record<string, string>;
}

type Handler<Body extends z.ZodType | undefined, Query extends z.ZodType | undefined> = (
  args: HandlerArgs<Body, Query>,
) => Promise<NextResponse>;

type RouteContext = { params: Promise<Record<string, string>> };

export function withRoute<
  Body extends z.ZodType | undefined = undefined,
  Query extends z.ZodType | undefined = undefined,
>(handler: Handler<Body, Query>, options: WithRouteOptions<Body, Query>) {
  return async (req: NextRequest, routeContext?: RouteContext): Promise<NextResponse> => {
    try {
      const ctx = await guards[options.guard](req);

      const body = options.body ? parseBody(options.body, await readJson(req)) : undefined;
      const query = options.query ? parseQuery(options.query, req) : undefined;
      const params = (await routeContext?.params) ?? {};

      const response = await handler({
        req,
        ctx,
        body: body as ParsedBody<Body>,
        query: query as ParsedQuery<Query>,
        params,
      });

      if (ctx.userId) {
        await touchLastActive(ctx.userId);
      }

      return response;
    } catch (error) {
      return mapErrorToResponse(error);
    }
  };
}

async function readJson(req: NextRequest): Promise<unknown> {
  if (req.method === "GET" || req.method === "HEAD") return {};
  return req.json().catch(() => ({}));
}

function parseBody<Body extends z.ZodType>(schema: Body, data: unknown): z.infer<Body> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError("VALIDATION_ERROR", "Neispravni podaci.", flattenZodError(parsed.error));
  }
  return parsed.data;
}

function parseQuery<Query extends z.ZodType>(schema: Query, req: NextRequest): z.infer<Query> {
  const raw = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError("VALIDATION_ERROR", "Neispravan upit.", flattenZodError(parsed.error));
  }
  return parsed.data;
}

function flattenZodError(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

function mapErrorToResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
        },
      },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Došlo je do greške." } },
    { status: 500 },
  );
}

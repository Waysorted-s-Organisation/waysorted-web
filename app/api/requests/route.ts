import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { saveAttachmentsFromFormData, parseString, type SavedAttachment } from "@/lib/attachments";
import FeatureRequest from "@/models/featureRequest";
import { getCurrentUser } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildQuery(searchParams: URLSearchParams) {
  const query: Record<string, unknown> = { isDeleted: false };
  const type = searchParams.get("type");
  const board = searchParams.get("board");
  const search = (searchParams.get("q") || "").trim();
  if (type) query.type = type;
  if (board) query.board = board;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { board: { $regex: search, $options: "i" } },
    ];
  }
  return query;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const query = buildQuery(url.searchParams);
    const sortParam = url.searchParams.get("sort");
    let sortOption: any = { createdAt: -1 };
    if (sortParam === "votes") {
      sortOption = { votes: -1, createdAt: -1 };
    }

    const data = await FeatureRequest.find(query).sort(sortOption);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/requests error", err);
    return NextResponse.json(
      { message: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

async function parseCreatePayload(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const title = parseString(formData.get("title")).trim();
    if (!title) throw new Error("Title is required");

    const description = parseString(formData.get("description"));
    const type = parseString(formData.get("type") || formData.get("requestType") || "feature");
    const board = parseString(formData.get("board"));
    const attachments = await saveAttachmentsFromFormData(formData);

    return { title, description, type, board, attachments } as {
      title: string;
      description: string;
      type: string;
      board: string;
      attachments: SavedAttachment[];
    };
  }

  const body = await req.json();
  if (!body?.title) throw new Error("Title is required");
  return {
    title: body.title,
    description: body.description || "",
    type: body.type || "feature",
    board: body.board || "",
    attachments: (body.attachments as SavedAttachment[]) || [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await parseCreatePayload(req);

    await dbConnect();
    const doc = await FeatureRequest.create({
      title: payload.title,
      description: payload.description,
      type: payload.type,
      board: payload.board,
      attachments: payload.attachments,
      authorId: user.id,
      authorName: user.name || user.email,
    });

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err) {
    console.error("POST /api/requests error", err);
    const message = err instanceof Error ? err.message : "Failed to create request";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}

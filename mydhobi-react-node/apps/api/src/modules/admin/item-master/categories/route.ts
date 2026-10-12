import { HttpResponse } from "@/server/http-response";

import { createItemCategory, listItemCategories } from "@/lib/item-master";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer")
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  return HttpResponse.json({
    categories: await listItemCategories(
      true,
      url.searchParams.get("search") ?? "",
    ),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer")
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const sortOrder = Number(body.sortOrder ?? 0);
    if (
      !name ||
      name.length > 100 ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    )
      return HttpResponse.json(
        { message: "Enter a valid category name and order." },
        { status: 400 },
      );
    return HttpResponse.json(
      {
        category: await createItemCategory({
          name,
          description:
            typeof body.description === "string"
              ? body.description.slice(0, 1000)
              : "",
          imagePath:
            typeof body.imagePath === "string"
              ? body.imagePath.slice(0, 250)
              : "",
          sortOrder,
          isActive: body.isActive !== false,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "23505"
    )
      return HttpResponse.json(
        { message: "A category with this name already exists." },
        { status: 409 },
      );
    console.error("Create item category failed", error);
    return HttpResponse.json(
      { message: "Unable to create category." },
      { status: 500 },
    );
  }
}

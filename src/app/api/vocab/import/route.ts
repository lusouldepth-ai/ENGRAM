import { importVocabBook } from "@/app/actions/vocab-actions";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    // 验证管理员权限
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { fileName, title, category, cefrLevel, description } = body;

        if (!fileName || !title || !category || !cefrLevel) {
            return NextResponse.json(
                { error: "Missing required fields: fileName, title, category, cefrLevel" },
                { status: 400 }
            );
        }

        const result = await importVocabBook(fileName, {
            title,
            category,
            cefrLevel,
            description,
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Import error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

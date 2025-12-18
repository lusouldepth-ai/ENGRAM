import { getVocabBooks, getRecommendedBooks, getUserLearningBooks } from "@/app/actions/vocab-actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VocabLibraryClient from "./vocab-library-client";

export const metadata = {
    title: "词库 | ENGRAM",
    description: "选择词书开始学习",
};

export default async function VocabLibraryPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 获取所有词书
    const { books } = await getVocabBooks();

    // 获取用户正在学习的词书
    const { progress } = await getUserLearningBooks();

    // 获取推荐词书
    const { books: recommendedBooks, userLevel } = await getRecommendedBooks();

    return (
        <VocabLibraryClient
            books={books || []}
            learningProgress={progress || []}
            recommendedBooks={recommendedBooks || []}
            userLevel={userLevel || 'B1'}
        />
    );
}

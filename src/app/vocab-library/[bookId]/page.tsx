import { getVocabBookDetail, getBookWords, getNextWordsToLearn } from "@/app/actions/vocab-actions";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import VocabBookDetailClient from "./vocab-book-detail-client";

interface Props {
    params: { bookId: string };
}

export async function generateMetadata({ params }: Props) {
    const { book } = await getVocabBookDetail(params.bookId);
    return {
        title: book ? `${book.title} | ENGRAM` : "词书详情",
    };
}

export default async function VocabBookDetailPage({ params }: Props) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { book, error } = await getVocabBookDetail(params.bookId);

    if (error || !book) {
        notFound();
    }

    // 获取前 50 个单词预览
    const { words } = await getBookWords(params.bookId, 0, 50);

    // 获取用户进度
    const { data: progress } = await supabase
        .from('user_vocab_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', params.bookId)
        .single();

    return (
        <VocabBookDetailClient
            book={book}
            words={words || []}
            progress={progress}
        />
    );
}

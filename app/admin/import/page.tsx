'use client';

import { useState } from "react";
import { Upload, Check, AlertCircle, Loader2 } from "lucide-react";

// 确保页面完全动态，不在构建时预渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminImportPage() {
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImportCET4 = async () => {
        setIsImporting(true);
        setResult(null);
        setError(null);

        try {
            const response = await fetch('/api/vocab/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: 'cet4-core-vocabulary.json',
                    title: '四级真题核心词',
                    category: '四六级',
                    cefrLevel: 'B1',
                    description: '大学英语四级考试核心高频词汇，包含真题例句和答题技巧'
                })
            });

            const data = await response.json();

            if (data.success) {
                setResult(data);
            } else {
                setError(data.error || 'Import failed');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">词库管理</h1>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">导入词库</h2>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">四级真题核心词</h3>
                            <p className="text-sm text-gray-500 mb-3">
                                文件: cet4-core-vocabulary.json<br />
                                等级: B1 | 分类: 四六级
                            </p>
                            <button
                                onClick={handleImportCET4}
                                disabled={isImporting}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-braun-accent text-white font-medium hover:bg-braun-accent/90 transition-colors disabled:opacity-50"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        导入中...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        开始导入
                                    </>
                                )}
                            </button>
                        </div>

                        {result && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 text-green-700 mb-2">
                                    <Check className="w-5 h-5" />
                                    <span className="font-medium">导入成功!</span>
                                </div>
                                <p className="text-sm text-green-600">
                                    已导入 {result.importedCount} / {result.totalCount} 个单词
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 text-red-700 mb-2">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="font-medium">导入失败</span>
                                </div>
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

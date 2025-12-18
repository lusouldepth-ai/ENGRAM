import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-[#F4F4F0] flex flex-col">
            <div className="h-16 border-b border-gray-200 bg-white/50 backdrop-blur-sm" />
            <div className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 flex flex-col gap-12">

                {/* Skeleton for Input Section */}
                <section className="w-full">
                    <div className="mb-6 flex items-center justify-between px-2">
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-16 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm" />
                </section>

                {/* Skeleton for Review Section */}
                <section className="w-full flex-1 flex flex-col min-h-[500px]">
                    <div className="mb-6 flex items-center justify-between px-2">
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex-1 bg-[#FAFAF9] rounded-3xl border border-[#E5E5E5] p-8 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                    </div>
                </section>

            </div>
        </div>
    );
}

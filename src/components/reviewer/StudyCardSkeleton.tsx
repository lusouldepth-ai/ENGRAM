'use client';

export function StudyCardSkeleton() {
    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-[600px] animate-pulse">
            {/* Progress Bar Skeleton */}
            <div className="w-full mb-6">
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden"></div>
            </div>

            {/* Card Container Skeleton */}
            <div className="w-full max-w-2xl aspect-[4/3] bg-white rounded-3xl shadow-sm border border-neutral-200 flex flex-col items-center justify-center p-8">
                {/* Top Icon Skeleton */}
                <div className="w-12 h-12 bg-neutral-100 rounded-full mb-8"></div>

                {/* Main Text Skeleton */}
                <div className="w-48 h-10 bg-neutral-100 rounded-lg mb-4"></div>

                {/* Subtitle Skeleton */}
                <div className="w-32 h-4 bg-neutral-50 rounded-lg mb-12"></div>

                {/* Action Buttons Skeleton */}
                <div className="w-full flex justify-center gap-4 mt-auto">
                    <div className="w-32 h-12 bg-neutral-100 rounded-xl"></div>
                    <div className="w-32 h-12 bg-neutral-100 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
}

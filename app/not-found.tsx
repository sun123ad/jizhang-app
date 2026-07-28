import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg font-medium text-gray-700">页面不存在</p>
      <Link href="/" className="text-blue-600 underline">
        返回首页
      </Link>
    </div>
  );
}

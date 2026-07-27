"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setInfo("注册成功，请查收邮件确认后登录（如果项目关闭了邮件确认，可直接登录）。");
      }
    }
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-[70vh] flex-col justify-center">
      <h1 className="mb-6 text-center text-2xl font-semibold">我们的账本</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6"
      >
        <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-md py-2 ${
              mode === "signin" ? "bg-white shadow font-medium" : "text-gray-500"
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md py-2 ${
              mode === "signup" ? "bg-white shadow font-medium" : "text-gray-500"
            }`}
          >
            注册
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          邮箱
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="you@example.com"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          密码
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="至少 6 位"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-600">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 py-2 font-medium text-white disabled:opacity-50"
        >
          {submitting ? "处理中..." : mode === "signin" ? "登录" : "注册"}
        </button>
      </form>
    </div>
  );
}

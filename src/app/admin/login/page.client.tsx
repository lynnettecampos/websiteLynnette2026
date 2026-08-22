"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const LOGIN_COPY = {
  title: "Panel administrativo",
  description:
    "Introduce la contraseña de administración para gestionar clientes, organizaciones y proyectos desde la web.",
  passwordLabel: "Contraseña",
  mailLabel: "Correo electrónico",
  submitLabel: "Entrar",
  errorMessage: "Credenciales incorrectas. Inténtalo de nuevo.",
  missingConfig:
    "Si tienes problemas para acceder, contacta al administrador.",
} as const;

export default function LoginPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending">("idle");
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      setError(LOGIN_COPY.errorMessage);
      return;
    }

    setStatus("pending");
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? LOGIN_COPY.errorMessage);
        setStatus("idle");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (loginError) {
      console.error(loginError);
      setError("No fue posible iniciar sesión. Revisa tu conexión e inténtalo nuevamente.");
      setStatus("idle");
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-8 rounded-3xl border border-foreground/10 bg-background p-8 shadow-sm">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">
            {LOGIN_COPY.title}
          </h1>
          <p className="text-sm text-foreground/60">{LOGIN_COPY.description}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
           <label className="space-y-2 text-sm font-medium text-foreground/80">
            <span>{LOGIN_COPY.mailLabel}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-2 text-base outline-none transition focus:border-foreground/40 focus:bg-background"
              required
              autoComplete="email"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground/80">
            <span>{LOGIN_COPY.passwordLabel}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-foreground/15 bg-foreground/5 px-4 py-2 text-base outline-none transition focus:border-foreground/40 focus:bg-background"
              required
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            disabled={status === "pending"}
            className="inline-flex w-full items-center justify-center rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-60"
          >
            {status === "pending" ? "Entrando…" : LOGIN_COPY.submitLabel}
          </button>
        </form>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : (
          <p className="rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3 text-xs text-foreground/50">
            {LOGIN_COPY.missingConfig}
          </p>
        )}
      </div>
    </div>
  );
}

import type {
  PropsWithChildren,
  ReactNode,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/shared/lib/cn";

export function Card(props: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("panel p-4", props.className)}>{props.children}</div>;
}

export function Button(
  props: PropsWithChildren<{
    className?: string;
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
    disabled?: boolean;
  }>
) {
  return (
    <button
      type={props.type || "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    >
      {props.children}
    </button>
  );
}

export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & { label?: string; containerClassName?: string }
) {
  return (
    <label className={cn("block space-y-2", props.containerClassName)}>
      {props.label ? <span className="text-sm text-slate-300">{props.label}</span> : null}
      <input
        {...props}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-brand-400",
          props.className
        )}
      />
    </label>
  );
}

export function Select(
  props: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; containerClassName?: string }
) {
  return (
    <label className={cn("block space-y-2", props.containerClassName)}>
      {props.label ? <span className="text-sm text-slate-300">{props.label}</span> : null}
      <select
        {...props}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white outline-none focus:border-brand-400",
          props.className
        )}
      />
    </label>
  );
}

export function TextArea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; containerClassName?: string }
) {
  return (
    <label className={cn("block space-y-2", props.containerClassName)}>
      {props.label ? <span className="text-sm text-slate-300">{props.label}</span> : null}
      <textarea
        {...props}
        className={cn(
          "w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-white outline-none focus:border-brand-400",
          props.className
        )}
      />
    </label>
  );
}

export function Badge(props: PropsWithChildren<{ className?: string }>) {
  return (
    <span className={cn("inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200", props.className)}>
      {props.children}
    </span>
  );
}

export function Stat(props: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{props.label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{props.value}</div>
    </div>
  );
}

export function ProgressBar(props: { value: number; max?: number }) {
  const max = props.max || 100;
  const pct = Math.max(0, Math.min(100, (props.value / max) * 100));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: pct + "%" }} />
    </div>
  );
}

export function PageHeader(props: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="page-title">{props.title}</h1>
        {props.subtitle ? <p className="page-subtitle mt-1">{props.subtitle}</p> : null}
      </div>
      {props.actions}
    </div>
  );
}

export function LoadingBlock() {
  return <div className="panel p-6 text-sm text-slate-300">Cargando...</div>;
}

export function ErrorBlock(props: { message: string }) {
  return <div className="panel border-red-500/20 bg-red-500/10 p-6 text-sm text-red-200">{props.message}</div>;
}

export function ShellLink(props: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        cn(
          "rounded-xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10",
          isActive && "active-link"
        )
      }
    >
      {props.children}
    </NavLink>
  );
}

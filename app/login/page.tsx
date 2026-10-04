import Auth from '@/components/Auth';

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Sign In</h1>
      <Auth />
    </div>
  );
}

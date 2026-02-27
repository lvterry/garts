import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GenerateFormProps {
  keyword: string;
  loading: boolean;
  onKeywordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function GenerateForm({ keyword, loading, onKeywordChange, onSubmit }: GenerateFormProps) {
  return (
    <section className="flex justify-center mb-12">
      <form onSubmit={onSubmit} className="flex gap-2 w-full max-w-md">
        <Input
          type="text"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="Enter a keyword..."
          disabled={loading}
          className="h-10"
        />
        <Button type="submit" disabled={loading || !keyword.trim()} className="h-10">
          {loading ? 'Generating...' : 'Generate'}
        </Button>
      </form>
    </section>
  );
}

"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { ActionButton } from "#/features/shared/components/ActionButton";
import { fieldClassName } from "#/features/shared/components/styles";

type CommentFormProps = {
	autoFocus?: boolean;
	error?: string;
	initialBody?: string;
	onCancel?: () => void;
	onSubmit: (body: string) => void;
	prompt: string;
	submitting?: boolean;
};

export function CommentForm({
	autoFocus,
	error,
	initialBody = "",
	onCancel,
	onSubmit,
	prompt,
	submitting = false,
}: CommentFormProps) {
	const [body, setBody] = useState(initialBody);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (autoFocus) {
			inputRef.current?.focus();
		}
	}, [autoFocus]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (submitting) {
			return;
		}

		onSubmit(body);
	};

	return (
		<form className="grid gap-2" onSubmit={handleSubmit}>
			<label className="grid gap-1.5">
				<span className="font-mono text-[var(--green)] text-sm">{prompt}</span>
				<input
					className={`${fieldClassName} min-h-[2.5rem] resize-y`}
					enterKeyHint="done"
					onChange={(event) => setBody(event.currentTarget.value)}
					ref={inputRef}
					required
					value={body}
				/>
			</label>
			{error ? <p className="m-0 text-[var(--red)] text-sm">{error}</p> : null}
			<div className="flex flex-wrap justify-end gap-2">
				{onCancel ? <ActionButton onClick={onCancel}>취소</ActionButton> : null}
				<ActionButton disabled={submitting} type="submit">
					저장
				</ActionButton>
			</div>
		</form>
	);
}

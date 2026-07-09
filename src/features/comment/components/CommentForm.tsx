"use client";

import type { FormEvent } from "react";
import { useState } from "react";

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
				<span className="font-mono text-sm text-[var(--green)]">{prompt}</span>
				<input
					autoFocus={autoFocus}
					className={`${fieldClassName} min-h-[2.5rem] resize-y`}
					enterKeyHint="done"
					onChange={(event) => setBody(event.currentTarget.value)}
					required
					value={body}
				/>
			</label>
			{error ? <p className="m-0 text-sm text-[var(--red)]">{error}</p> : null}
			<div className="flex flex-wrap justify-end gap-2">
				{onCancel ? <ActionButton onClick={onCancel}>취소</ActionButton> : null}
				<ActionButton disabled={submitting} type="submit">
					저장
				</ActionButton>
			</div>
		</form>
	);
}

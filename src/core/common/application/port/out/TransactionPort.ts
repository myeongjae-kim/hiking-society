export type TransactionPropagation = "REQUIRED" | "REQUIRES_NEW";

export type TransactionOptions = {
	readOnly?: boolean;
	propagation?: TransactionPropagation;
};

export interface TransactionPort {
	run<T>(work: () => Promise<T>, options?: TransactionOptions): Promise<T>;
}

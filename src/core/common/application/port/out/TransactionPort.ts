export type TransactionOptions = {
	readOnly?: boolean;
};

export interface TransactionPort {
	run<T>(work: () => Promise<T>, options?: TransactionOptions): Promise<T>;
}

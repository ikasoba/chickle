export type Assign<A, B> = { [ K in keyof A | keyof B ]: K extends keyof B ? B[K] : K extends keyof A ? A[K] : never }

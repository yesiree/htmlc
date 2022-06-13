#!/usr/bin/env node
export declare const read: (path: string) => Promise<string>;
export declare const write: (path: string, data: any) => Promise<void>;
export declare const htmlc: ({ src, dest, watch, minify }: {
    src: string;
    dest: string;
    watch?: boolean | undefined;
    minify?: boolean | undefined;
}) => Promise<void>;

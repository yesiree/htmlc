#!/usr/bin/env node
export declare const read: (path: string) => Promise<string>;
export declare const write: (path: string, data: any) => Promise<void>;
export declare const htmlc: ({ src, dest }: {
    src: string;
    dest: string;
}) => Promise<void>;

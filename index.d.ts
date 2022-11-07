#!/usr/bin/env node
import chokidar from 'chokidar';
export declare const read: (path: string) => Promise<string>;
export declare const write: (path: string, data: any) => Promise<void>;
export declare const htmlc: ({ src, out, watch, compress, module }: {
    src: string;
    out: string;
    watch: boolean;
    compress: boolean;
    module: boolean;
}) => Promise<chokidar.FSWatcher | undefined>;

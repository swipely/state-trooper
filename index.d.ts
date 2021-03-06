// Type definitions for state-trooper 2.1
// Project: state-trooper
// Definitions by: Andrew Goodale <andrewgoodale@upserve.com>

export interface Cursor<T> {
  readonly path: string[];

  deref(path?: string | string[]): T | null;
  replace(val: T | null, callback?: CursorCallback<T>): void;
  set(val: Partial<T>, callback?: CursorCallback<T>): void;
  remove(callback?: CursorCallback<T>): void;

  refine<U>(path: string | string[]): Cursor<U>;

  equals(other: any): boolean;

  fetch(): void;
  persist(): void;
}

export interface ArrayCursor<T> extends Cursor<Array<T>> {
  add(val: T, callback?: CursorCallback<T>): void;
}

export type CursorCallback<T> = (cursor: Cursor<T>, rootCursor: Cursor<any>) => void;

export type QueryDef = string | object;

export interface DataStore {
  readonly fetcher?: (cursor: Cursor<any>, rootCursor: Cursor<any>, query?: QueryDef) => void;
  readonly persister?: (cursor: Cursor<any>, update: StateUpdate, rootCursor: Cursor<any>) => void;
  readonly initialFetch?: boolean;
  readonly query?: QueryDef;
}

export interface StateDescriptor<T> {
  readonly state: T;
  readonly dataStore?: { [key: string]: DataStore };
  readonly stakeout?: { [key: string]: Array<StakeoutHandler> };
}

export type UpdateAction = 'set' | 'replace' | 'add' | 'remove';

export interface StateUpdate {
  readonly path: string[];
  readonly action: UpdateAction;
  readonly value: any;
}

export type StakeoutHandler = (
  cursor: Cursor<any>,
  update: StateUpdate,
  rootCursor: Cursor<any>
) => void;

export function patrol<T>(stateDesc: StateDescriptor<T>): any;

export function patrolRunLoop<T>(
  stateDesc: StateDescriptor<T>,
  updateHandler: (cursor: Cursor<T>) => boolean | void
): Cursor<T>;

export function stakeout(path: string, handler: StakeoutHandler): void;

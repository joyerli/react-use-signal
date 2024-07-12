import * as React from 'react';
import EventEmitter from 'eventemitter3';
import isFunction from 'lodash.isfunction';

export type Value<A> = (A | ((prevState: A) => A));
export type Dispatch<A> = (value: Value<A>) => void;
export type UseValue<A> = () => A;
export type GetValue<A> = () => A;
export type SubscribeCallback<A> = (value: A) => void;
export type Subscribe<A> = (callback: SubscribeCallback<A>) => () => void;

const emitter = new EventEmitter();

export interface Channel<S> {
  /**
   * 获取信号最新值，该值不支持响应式
   */
  getValue: GetValue<S>;
  /**
   * 获取信号值的hook，注意符合hook的使用规范
   */
  useValue: UseValue<S>;
  /**
   * 设置信号值
   */
  setValue: Dispatch<S>;
  /**
   * 信号值变化的订阅函数
   */
  subscribe: Subscribe<S>;
}

export default function useSharedState<S>(
  initialState: S | (() => S),
): Channel<S> {
  const eventNameRef = React.useRef<string>(`SharedState_${String(Math.random()).slice(2)}`);
  const initialValue: S = React.useMemo(() => {
    if(isFunction(initialState)) {
      return initialState();
    }
    return initialState;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const valueRef = React.useRef<S>(initialValue);

  React.useEffect(() => {
    const eventName = eventNameRef.current;

    return () => {
      if (emitter.eventNames().includes(eventName)) {
        emitter.removeAllListeners(eventName);
        emitter.off(eventName);
      }
    };
  }, []);

  const dispatch: Dispatch<S> = React.useCallback<Dispatch<S>>((value) => {
    valueRef.current = isFunction(value) ? value(valueRef.current) : value;
    emitter.emit(eventNameRef.current, valueRef.current);
  }, []);

  const subscribe: Subscribe<S> = React.useCallback<Subscribe<S>>((callback) => {
    // 避免重复注册
    emitter.off(eventNameRef.current, callback);
    emitter.addListener(eventNameRef.current, callback);
    // 注销
    return () => {
      emitter.off(eventNameRef.current, callback);
    };
  }, []);

  const useValue: UseValue<S> = React.useMemo<UseValue<S>>(() => {
    return () => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [state, setState] = React.useState<S>(valueRef.current);
      const subscribeFn = React.useCallback<SubscribeCallback<S>>((value) => {
        setState(value);
      }, []);

      // eslint-disable-next-line react-hooks/rules-of-hooks
      React.useLayoutEffect(() => {
        const unsubscribe = subscribe(subscribeFn);
        return () => {
          unsubscribe();
        };
      }, [subscribeFn]);
      return state;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getValue: GetValue<S> = React.useCallback<GetValue<S>>(() => {
    return valueRef.current;
  }, []);

  const sharedState = React.useMemo(() => ({
    useValue, getValue, setValue: dispatch, subscribe,
  }), []);

  return sharedState;
}

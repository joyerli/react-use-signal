import * as React from 'react';
import * as tlr from '@testing-library/react';
import useSignal from '../../dist/react-use-signal.es';

export default async function waitFakeTimer(advanceTime = 1000, times = 20) {
  for (let i = 0; i < times; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await tlr.act(async () => {
      await Promise.resolve();
      if (advanceTime > 0) {
        jest.advanceTimersByTime(advanceTime);
        return;
      }
      jest.runAllTimers();
    });
  }
}

describe('信号使用', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterAll(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  it('像普通状态一样使用', async () => {
    const TestContainer: React.FC<{}> = () => {
      const numberSignal = useSignal(1);
      const number = numberSignal.useValue();

      return (<div className='viewer' onClick={() => {
        numberSignal.setValue(10);
      }}>{number}</div>);
    };
    const { container } = tlr.render(<TestContainer />);
    await waitFakeTimer();
    expect(container.querySelector('.viewer')?.innerHTML).toEqual('1');
    await waitFakeTimer();
    tlr.fireEvent.click(container.querySelector('.viewer')!);
    await waitFakeTimer();
    expect(container.querySelector('.viewer')?.innerHTML).toEqual('10');
  });
  it('跨组件通信, 不会导致其他组件更新', async () => {
    const Context = React.createContext<any>({})
    let countA = 0;
    let countB = 0;
    let countC = 0;
    let countD = 0;
    const SubCompA: React.FC<{}> = () => {
      countA += 1;
      const { numberSignal } = React.useContext(Context);
      const number = numberSignal.useValue();
      return (<div>
        {countA}
        {number}
      </div>);
    };
    const SubCompC: React.FC<{}> = () => {
      countC += 1;
      const { numberSignal } = React.useContext(Context);
      return (<button className='__button' onClick={() => {
        numberSignal.setValue(10);
      }}>我是按钮</button>);
    };
    const SubCompB: React.FC<{}> = () => {
      countB += 1;
      return (<div>
        <SubCompC />
      </div>);
    };
    const SubCompD: React.FC<{}> = () => {
      countD += 1;
      return (<div></div>);
    };
    const Root: React.FC<{}> = () => {
      const numberSignal = useSignal(1);
      return (<Context.Provider value={{ numberSignal }}>
        <SubCompA />
        <SubCompB />
        <SubCompD />
      </Context.Provider>);
    };
    const { container } = tlr.render(<Root />);
    await waitFakeTimer();
    expect(countA).toEqual(1);
    expect(countB).toEqual(1);
    expect(countC).toEqual(1);
    expect(countD).toEqual(1);
    await waitFakeTimer();
    tlr.fireEvent.click(container.querySelector('.__button')!);
    await waitFakeTimer();
    expect(countA).toEqual(2);
    expect(countB).toEqual(1);
    expect(countC).toEqual(1);
    expect(countD).toEqual(1);
  });
});

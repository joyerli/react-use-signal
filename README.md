# react-use-shared-state
 
react-use-shared-state为一个react hook工具，非常纯粹，只解决：
* 数据共享
* 防止非必要的re-render

它只能在react hooks中使用，可以让你像使用`useState`一样管理跨组件的状态。支持细颗粒度，直接面向基本数据类型，没有额外的数据存储中心(直接利用react的状态)。也不依赖`React.memo`才能发挥作用。

## 使用

添加依赖:

```shell
yarn add @joyer/react-use-shared-state
```

使用：
```jsx
import useSharedState from '@joyer/react-use-shared-state';

const Context = React.createContext({});
const ChildA: React.FC = () => {
  const { numberSharedState } = React.useContext(Context);
  const number = numberSharedState.useValue();
  return (<div>{number}</div>);
};
const ChildB: React.FC<{}> = () => {
  const { numberSharedState } = React.useContext(Context);
  return (<button onClick={() => {
    numberSharedState.setValue(10);
  }}>按钮</button>);
};
const Root: React.FC<{}> = () => {
  const numberSharedState = useSharedState(1);
  return (<Context.Provider value={{ numberSharedState }}>
    <ChildA />
    <ChildB />
  </Context.Provider>);
};
```
> 你可以配合context流行的工具库unstated-next一起使用

使用`useSharedState`hook声明创建一个跨组件共享状态的通道，该通道返回值引用固定。创建通道时并没有状态的生成，也就是说，声明通道的组件并不会受到对应状态更新而导致当前组件的re-render。调用通道`sharedState`返回值的`useValue`hook时才会在当前组件中创建一个状态，该状态会受到通道中事件流的控制从而触发当前组件的re-render。具体内容如果感兴趣可以阅读后续的背景和实现原理。

在上文的案例中，你会发现，当点击按钮时，只有组件`ChildA`会发生`re-render`，真正做到「应渲尽渲」,而不需要渲染的，一个都不会，且这一切还不需要依赖`React.memo`。

> 下文中会介绍一些其他的api, 这些api其实是借鉴了signal的理念中的设计。

### 获取引用值
如果需要实时获取一个共享状态的最新值(事件中的命令式使用，本质为`ref`)，可以直接调用共享状态通道的`getValue`函数获取：

```tsx
const sharedState = useSharedState(1);
const value = sharedState.getValue();
```

这样返回的`value`将不会是一个响应式数据(为一个`ref`值)，在状态被其他组件更新后，也不会导致当前组件的re-render。建议在当前组件中只有事件逻辑中需要一个共享组件的的值时使用，可以避免当前组件因为该状态变化触发re-render。

### 订阅
可以对一个共享状态变化进行订阅：
```tsx
const sharedState = useSharedState(1);
React.useEffect(() => {
  sharedState.subscribe((value) => {
    // 做一些额外的事情，比如有选择的更新当前某个当前组件状态的变化或者执行一些方法
  });
}, []);
```

使用订阅可以只在特定的条件下才去触发当前组件的一些行为，避免使用一个状态的完全响应式能力，从而手动降低组件一些非必要的re-render。

### 计算属性
如上文中所说，使用`useSharedState`时，并不是像`Context`那样进行状态提升，只是声明了一个共享状态管理通道，在提供通道的共同祖节点中，是无法对状态进行`useMemo`来生成计算属性。

如果需要使用类似计算属性的能力，需要理解：由于状态并没有提升，这些状态还是是分散在各个组件中的，只是通过一个相同的通道进行统一管理而已。对于需要复用多个状态处理的逻辑，可以封装成新的hooks，如：

```tsx
import useSharedState from '@joyer/react-use-shared-state';

const Context = React.createContext({})

function useIsAdult() {
  const { ageSharedState } = React.useContext(Context);
  const age = ageSharedState.useValue();
  const isAdult = React.useMemo(() => {
    return age >= 18;
  }, [age]);
}

const ChildA: React.FC = () => {
  const isAdult = useIsAdult();
  return (<div>
    {isAdult ? '成年人' : '未成年'}
  </div>);
};
const ChildB: React.FC<{}> = () => {
  const { ageSharedState } = React.useContext(Context);
  return (<button onClick={() => {
    ageSharedState.setValue(10);
  }}>按钮</button>);
};
const Root: React.FC<{}> = () => {
  const ageSharedState = useSharedState(1);
  return (<Context.Provider value={{ ageSharedState }}>
    <ChildA />
    <ChildB />
  </Context.Provider>);
};
```

## 优势

1. 非常轻量，可以从下文中的背景和设计理念来看，react-use-shared-state想要解决的问题非常简单，它本质上就是一个事件流工具；

2. 由于轻量，所以灵活。

3. 不依赖react.memo，也就是连equals计算消耗都没有；

4. 等同于hook同样的状态细颗粒度，本质上就是每个组件的已由状态。当你不需要redux，mobx这种都是基于对象的状态流，不喜欢抽象什么领域，模型的情况下，使用react-use-shared-state体验非常友好，使用体验也是无限接近于原生的hook；

5. 性能卓越，非常容易做到「真正的需要渲染的地方才渲染」的效果；

6. 非常容易集成到已有系统。就算接手的系统已经是一座「屎山」，使用react-use-shared-state进行改造也非常简单(只需要对跨组件的状态进行一一改造就行)，且可以渐进式慢慢改造。对于不考虑后续维护性和可读性的话，还可以简单的将一个页面的跨组件状态都放在同一个地方，这样的行为并不会影响性能。

## 背景

如果你也喜欢使用react的函数组件，并喜欢使用react原生的hook进行状态管理，不想引入redux,MboX这种具有自己独立的状态管理的重量级/对象级的状态流框架的话，可以使用当前工具。

首先探讨如果不采用redux,mobx，使用原生的react的跨组件共享状态方案`Context`，会具备那些问题？

react原生的跨组件通信为`Context`，在使用`Context`进行组件之间通信时，需要进行状态提升，就是将状态放在通信的组件公共的祖先节点之中。这会导致数据的变化时祖先组件节点`re-render`, 从而整个组件树都会re-render，带来非常大的性能损失。react官方推荐我们使用`React.memo`包裹函数，降低非必要组件渲染。如：

```tsx
const Context = React.createContext<any>({})
const SubCompA: React.FC<{}> = React.memo(() => {
  console.log('渲染了A');
  const { number } = React.useContext(Context);
  return (<div>
    {number}
  </div>);
});
const SubCompC: React.FC<{}> = React.memo(() => {
  console.log('渲染了C');
  const { setNumber } = React.useContext(Context);
  return (<button className='__button' onClick={() => {
    setNumber(10);
  }}>我是按钮</button>);
});
const SubCompB: React.FC<{}> = React.memo(() => {
  console.log('渲染了B');
  return (<div>
    <SubCompC />
  </div>);
});
const SubCompD: React.FC<{}> = React.memo(() => {
  console.log('渲染了D');
  return (<div></div>);
});
const Root: React.FC<{}> = React.memo(() => {
  console.log('渲染了Root');
  const [number, setNumber] = React.useState(1);
  return (<Context.Provider value={{ number, setNumber }}>
    <SubCompA />
    <SubCompB />
    <SubCompD />
  </Context.Provider>);
});
```

在本案例中，点击按钮后，还是会导致组件`SubCompA`, `SubCompC`, `Root`组件re-render，但`SubCompC`, `Root`都是不期望re-render的额外渲染。且在实际使用情况下，性能会损失更大，因为：
* 不会把每一个单独的状态放到一个独立的Context。也就是Context中通常会包含多个状态。当其中任何一个状态发生变化时，所有使用了该Context的组件都会更新，不管你有没有依赖具体发生变化的那个状态。这也会导致，re-render的非法扩散(不受期望re-render)。
* 非常依靠`React.memo`发挥效果，但在实际开发过程，使`React.memo`保持完美的运行是一件非常困难的事情。如不允许使用对象和函数的字面量，一些特殊情况下还需要去维护`memo`的第二个复杂的`equals`函数。


如下面的对于组件的使用：
```tsx
const CompA: React.FC<{}> = React.memo(() => {
  return (<div>1</div>);
});

const Root: React.FC<{}> = React.memo(() => {
  return (<CompA objectProp={{ name: 'joy' }} onClick={() => {
    // ....
  }} />);
});
```
在本案例中，上文对于`CompA`进行`React.memo`包裹将没有一点意义。需要调整为：

```tsx
const CompA: React.FC<{}> = React.memo(() => {
  return (<div>1</div>);
});

const Root: React.FC<{}> = React.memo(() => {
  const objectProp = React.useMemo(() => ({ name: 'joy' }));
  const handleClick = React.useCallback(() => {
    // ....
  }, []);
  return (<CompA objectProp={objectProp} onClick={handleClick} />);
});
```

> 这里并不是想说`memo`函数没有必要。`memo`是提升性能的一个很重要的手段，在平常开发过程中，非常需要严格开发，努力使`memo`发挥作用。这里的说明只是想说，在实际情况下，理想跟现实还是有差距的。

`Context`中造成性能损失，主要的原因是状态提升，导致更大范围的组件re-render导致。

## 设计理念

为了解决原生`Context`的问题，如果不对状态进行提升，有什么办法通知另一个(or多个)组件的状态需要更新了呢？ 其中一种就是使用事件。

如：
```tsx
const eventEmitter = new EventEmitter();
const CompA: React.FC<{}> = React.memo(() => {
  const [age, setAge] = React.useState(0);
  React.useEffect(() => {
    eventEmitter.addListener('updateAge', setAge);
  }, []);
  return (<div>{state}</div>);
});

const CompB: React.FC<{}> = React.memo(() => {
  return (<div onClick={() => {
    eventEmitter.emit('updateAge', 10);
  }}>1</div>);
});

const Root: React.FC<{}> = React.memo(() => {
  return (<>
    <CompA />
    <CompB />
  </>);
});
```

直接使用事件流，在复杂系统中，需要的管理的状态流非常庞大，事件也将非常多以至于难以管理，此时需要将其封装，屏蔽其复杂性。

在react-use-shared-state中，使用一个事件器进行通信。对于一组使用同样事件名的状态称为通道，该通道会在hook`useSharedState`调用时创建，此时主要是生成一个随机的事件名(该事件名在调用hook的组件的声明周期内保持不变)，同时在组件销毁时，自动注销事件的监听器。实际的状态生成和注册事件的逻辑，在需要状态的组件中调用执行，也就是对`useSharedState`返回的通道中的`useValue`hook调用时才执行创建状态和注册监听事件修改状态的逻辑。

> `useSharedState`这个hook返回值中有一个hook, 可以理解它为一个hook工厂。这在react官方中是不推荐的，但在实际使用过程中，并不会导致某个组件hook的数量处于动态变化的情况下。



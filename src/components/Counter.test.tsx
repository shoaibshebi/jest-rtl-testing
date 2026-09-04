import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';


import { Counter } from './Counter';

/**
 * The RTL loop is always the same three steps:
 *   1. render(<Component />)
 *   2. find something the way a user would  -> screen.getByRole(...)
 *   3. interact, then assert on what changed -> await user.click(...) / expect(...)
 *
 * Note there is no cleanup here: RTL auto-unmounts between tests.
 */


describe('<Counter/> Steps',()=>{
  it('renders the initial count as zero',()=>{
    render(<Counter />)
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  })

  it('respect the initial count prop',()=>{
    render(<Counter initialCount={7} />)

    expect(screen.getByTestId('count')).toHaveTextContent('7')
  })

  it('increments and decrements',async()=>{
    render(<Counter initialCount={0} />)

    const user = userEvent.setup()

    await user.click(screen.getByRole('button',{name:'Increment'}))

    expect(screen.getByTestId('count')).toHaveTextContent('1')

    await user.click(screen.getByRole('button',{name: 'Decrement'}))

    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  it('steps by the given amount by user', async ()=>{
    const user = userEvent.setup();

    render(<Counter step={5} />)

    await user.click(screen.getByRole('button',{name:'Increment'}));

    expect(screen.getByTestId('count')).toHaveTextContent('5');
  })

  it('resets back to the initial count', async()=>{
    render(<Counter initialCount={3} />)

    const user = userEvent.setup()

    await user.click(screen.getByRole('button',{name:'Increment'}))
    await user.click(screen.getByRole('button',{name:'Increment'}))

    expect(screen.getByTestId('count')).toHaveTextContent('5')

    await user.click(screen.getByRole('button',{name: 'Reset'}))

    expect(screen.getByTestId('count')).toHaveTextContent('3')
  })

  it('disables the buttons at the bounds', async()=>{
    const user = userEvent.setup()

    render(<Counter initialCount={0} min={0} max={1} />)

    const decrement = screen.getByRole('button',{name:'Decrement'})
    const increment = screen.getByRole('button',{name:'Increment'})

    expect(decrement).toBeDisabled()
    expect(increment).toBeEnabled()

    await user.click(increment)

    expect(decrement).toBeEnabled()

    await user.click(decrement)

    expect(decrement).toBeDisabled()
  })

  it('anoucnes when max limit reaches', async()=>{
    render(<Counter max={1} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    const user = userEvent.setup()

    await user.click(screen.getByRole('button',{name:'Increment'}))

    expect(screen.queryByRole('status')).toBeInTheDocument()

    expect(screen.queryByRole('status')).toHaveTextContent('Maximum reached');
  })


  it('calls onchange with the new value', async()=>{
    const user = userEvent.setup()
    const onChange = jest.fn()

    render(<Counter onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Increment' }));
    await user.click(screen.getByRole('button', { name: 'Increment' }));

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenNthCalledWith(2,2)
    expect(onChange).toHaveBeenLastCalledWith(2)
  })

  it('does not call onchange on redner',()=>{
    const onChange = jest.fn()

    expect(onChange).not.toHaveBeenCalled()
  })

})

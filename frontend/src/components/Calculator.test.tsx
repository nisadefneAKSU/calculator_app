import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as client from '../api/calculatorClient'
import { Calculator } from './Calculator'

vi.mock('../api/calculatorClient', () => ({
  calculate: vi.fn(),
}))

const mockedCalculate = vi.mocked(client.calculate)

afterEach(() => {
  vi.resetAllMocks()
})

describe('Calculator (integration)', () => {
  it('performs 6 x 7 = 42 end to end through the keypad', async () => {
    mockedCalculate.mockResolvedValue({ result: 42, operation: 'multiply' })
    const user = userEvent.setup()
    render(<Calculator />)

    await user.click(screen.getByText('6'))
    await user.click(screen.getByLabelText('Multiply'))
    await user.click(screen.getByText('7'))
    await user.click(screen.getByLabelText('Equals'))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('42'))
    expect(mockedCalculate).toHaveBeenCalledWith({ operation: 'multiply', a: 6, b: 7 })
  })

  it('shows a friendly error message when dividing by zero', async () => {
    const { ApiError } = await import('../api/types')
    mockedCalculate.mockRejectedValue(new ApiError('division by zero is not allowed'))
    const user = userEvent.setup()
    render(<Calculator />)

    await user.click(screen.getByText('5'))
    await user.click(screen.getByLabelText('Divide'))
    await user.click(screen.getByText('0'))
    await user.click(screen.getByLabelText('Equals'))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('division by zero is not allowed')
    )
  })

  it('resets the calculator when Clear is pressed', async () => {
    const user = userEvent.setup()
    render(<Calculator />)

    await user.click(screen.getByText('9'))
    expect(screen.getByRole('status')).toHaveTextContent('9')

    await user.click(screen.getByLabelText('Clear'))
    expect(screen.getByRole('status')).toHaveTextContent('0')
  })

  it('renders an empty-state message before any calculation has run', () => {
    render(<Calculator />)
    expect(screen.getByText(/recent calculations/i)).toBeInTheDocument()
  })
})

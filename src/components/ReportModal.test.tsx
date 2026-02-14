import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportModal } from './ReportModal'

describe('ReportModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isPending: false,
  }

  const getReasonSelect = () => screen.getByRole('combobox')
  const getDetailsTextarea = () => screen.getByPlaceholderText(/additional context/i)

  it('renders modal with title and reason select', () => {
    render(<ReportModal {...defaultProps} />)
    expect(screen.getByText('Report Content')).toBeInTheDocument()
    expect(screen.getByText('Reason')).toBeInTheDocument()
    expect(getReasonSelect()).toBeInTheDocument()
  })

  it('uses custom title', () => {
    render(<ReportModal {...defaultProps} title="Report Message" />)
    expect(screen.getByText('Report Message')).toBeInTheDocument()
  })

  it('does not show details textarea initially', () => {
    render(<ReportModal {...defaultProps} />)
    expect(screen.queryByPlaceholderText(/additional context/i)).not.toBeInTheDocument()
  })

  it('shows details textarea when reason selected', async () => {
    const user = userEvent.setup()
    render(<ReportModal {...defaultProps} />)

    await user.selectOptions(getReasonSelect(), 'spam')
    expect(getDetailsTextarea()).toBeInTheDocument()
  })

  it('submit button disabled without reason', () => {
    render(<ReportModal {...defaultProps} />)
    const submitBtn = screen.getByRole('button', { name: /submit report/i })
    expect(submitBtn).toBeDisabled()
  })

  it('calls onSubmit with reason and details', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ReportModal {...defaultProps} onSubmit={onSubmit} />)

    await user.selectOptions(getReasonSelect(), 'spam')
    await user.type(getDetailsTextarea(), 'Bot posting links')
    await user.click(screen.getByRole('button', { name: /submit report/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      reason: 'spam',
      details: 'Bot posting links',
    })
  })

  it('calls onSubmit with reason only when no details', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ReportModal {...defaultProps} onSubmit={onSubmit} />)

    await user.selectOptions(getReasonSelect(), 'harassment')
    await user.click(screen.getByRole('button', { name: /submit report/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      reason: 'harassment',
      details: undefined,
    })
  })

  it('shows pending state', () => {
    render(<ReportModal {...defaultProps} isPending={true} />)
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled()
  })

  it('cancel calls onClose and resets state', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<ReportModal {...defaultProps} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render when closed', () => {
    render(<ReportModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Report Content')).not.toBeInTheDocument()
  })
})

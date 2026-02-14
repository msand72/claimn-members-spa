import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GlassTable, GlassTablePagination } from './GlassTable'

type TestRow = { id: string; name: string; score: number }

const columns = [
  { key: 'name' as const, header: 'Name' },
  { key: 'score' as const, header: 'Score', sortable: true },
]

const data: TestRow[] = [
  { id: '1', name: 'Alice', score: 95 },
  { id: '2', name: 'Bob', score: 87 },
  { id: '3', name: 'Charlie', score: 92 },
]

describe('GlassTable', () => {
  it('renders column headers', () => {
    render(<GlassTable columns={columns} data={data} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Score')).toBeInTheDocument()
  })

  it('renders data rows', () => {
    render(<GlassTable columns={columns} data={data} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('87')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('shows empty message when data is empty', () => {
    render(<GlassTable columns={columns} data={[]} emptyMessage="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('shows default empty message', () => {
    render(<GlassTable columns={columns} data={[]} />)
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('shows loading skeleton when isLoading=true', () => {
    const { container } = render(<GlassTable columns={columns} data={[]} isLoading />)
    const skeletonRows = container.querySelectorAll('tr.animate-pulse')
    expect(skeletonRows.length).toBe(5)
  })

  it('calls onSort when sortable header clicked', () => {
    const onSort = vi.fn()
    render(<GlassTable columns={columns} data={data} onSort={onSort} />)
    fireEvent.click(screen.getByText('Score'))
    expect(onSort).toHaveBeenCalledWith('score')
  })

  it('does not call onSort for non-sortable columns', () => {
    const onSort = vi.fn()
    render(<GlassTable columns={columns} data={data} onSort={onSort} />)
    fireEvent.click(screen.getByText('Name'))
    expect(onSort).not.toHaveBeenCalled()
  })

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn()
    render(<GlassTable columns={columns} data={data} onRowClick={onRowClick} />)
    fireEvent.click(screen.getByText('Alice'))
    expect(onRowClick).toHaveBeenCalledWith(data[0], 0)
  })

  it('renders custom render function', () => {
    const customColumns = [
      ...columns,
      {
        key: 'badge' as const,
        header: 'Badge',
        render: (item: TestRow) => <span data-testid="badge">{item.score > 90 ? 'A' : 'B'}</span>,
      },
    ]
    render(<GlassTable columns={customColumns} data={data} />)
    const badges = screen.getAllByTestId('badge')
    expect(badges[0].textContent).toBe('A') // Alice: 95
    expect(badges[1].textContent).toBe('B') // Bob: 87
  })

  it('shows null/undefined as dash', () => {
    const sparseData = [{ id: '1', name: null, score: undefined }] as unknown as TestRow[]
    render(<GlassTable columns={columns} data={sparseData} />)
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBe(2)
  })
})

describe('GlassTablePagination', () => {
  it('renders page info', () => {
    render(<GlassTablePagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()
  })

  it('renders page buttons', () => {
    render(<GlassTablePagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('calls onPageChange for next/previous', () => {
    const onPageChange = vi.fn()
    render(<GlassTablePagination currentPage={2} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByText('Next'))
    expect(onPageChange).toHaveBeenCalledWith(3)
    fireEvent.click(screen.getByText('Previous'))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('disables Previous on first page', () => {
    const onPageChange = vi.fn()
    render(<GlassTablePagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)
    const prev = screen.getByText('Previous')
    expect(prev).toBeDisabled()
  })

  it('disables Next on last page', () => {
    const onPageChange = vi.fn()
    render(<GlassTablePagination currentPage={5} totalPages={5} onPageChange={onPageChange} />)
    const next = screen.getByText('Next')
    expect(next).toBeDisabled()
  })

  it('limits visible pages to 5 for large page counts', () => {
    render(<GlassTablePagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />)
    // Should show pages 3-7 (5 pages centered on current)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.queryByText('2')).not.toBeInTheDocument()
    expect(screen.queryByText('8')).not.toBeInTheDocument()
  })
})

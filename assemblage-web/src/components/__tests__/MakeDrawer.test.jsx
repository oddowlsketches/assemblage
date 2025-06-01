import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MakeDrawer } from '../MakeDrawer'

// Mock the SourceSelector component
vi.mock('../SourceSelector', () => ({
  SourceSelector: ({ activeSource, activeSourceName }) => (
    <div data-testid="source-selector">
      Mock SourceSelector: {activeSourceName} ({activeSource})
    </div>
  )
}))

// Mock the color utils
vi.mock('../../lib/colorUtils/contrastText', () => ({
  getContrastText: () => '#333333'
}))

describe('MakeDrawer', () => {
  const defaultProps = {
    isOpen: false,
    onClose: vi.fn(),
    onApplyAndClose: vi.fn(),
    activeCollection: 'cms',
    activeCollectionName: 'Default Library',
    onSourceChange: vi.fn(),
    onManageCollections: vi.fn(),
    onUploadImages: vi.fn(),
    onOpenGallery: vi.fn(),
    userCollections: [
      { id: '00000000-0000-0000-0000-000000000001', name: 'Default Library' },
      { id: 'user-collection-1', name: 'My Images' }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.innerWidth for mobile/desktop detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
  })

  it('should not render when isOpen is false', () => {
    render(<MakeDrawer {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Collage settings')).not.toBeInTheDocument()
  })

  it('should render desktop drawer when isOpen is true and desktop viewport', () => {
    window.innerWidth = 1024
    render(<MakeDrawer {...defaultProps} isOpen={true} />)
    
    expect(screen.getByText('Collage settings')).toBeInTheDocument()
    expect(screen.getByText('Image Source')).toBeInTheDocument()
    expect(screen.getByText('Apply & Close')).toBeInTheDocument()
    expect(screen.getByTestId('source-selector')).toBeInTheDocument()
  })

  it('should render mobile bottom sheet when isOpen is true and mobile viewport', () => {
    window.innerWidth = 500
    render(<MakeDrawer {...defaultProps} isOpen={true} />)
    
    expect(screen.getByText('Collage settings')).toBeInTheDocument()
    expect(screen.getByText('Image Source')).toBeInTheDocument()
    expect(screen.getByText('Apply & Close')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<MakeDrawer {...defaultProps} isOpen={true} onClose={onClose} />)
    
    // Find the close button by looking for the X button (it should be the first button with an SVG icon)
    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find(button => 
      button.querySelector('svg') // phosphor-react X icon
    ) || closeButtons[0] // fallback to first button
    
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onApplyAndClose when Apply button is clicked', () => {
    const onApplyAndClose = vi.fn()
    render(<MakeDrawer {...defaultProps} isOpen={true} onApplyAndClose={onApplyAndClose} />)
    
    const applyButton = screen.getByRole('button', { name: /apply & close/i })
    fireEvent.click(applyButton)
    
    expect(onApplyAndClose).toHaveBeenCalledTimes(1)
  })

  it('should handle escape key to close drawer', () => {
    const onClose = vi.fn()
    render(<MakeDrawer {...defaultProps} isOpen={true} onClose={onClose} />)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not call onClose on escape when drawer is closed', () => {
    const onClose = vi.fn()
    render(<MakeDrawer {...defaultProps} isOpen={false} onClose={onClose} />)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should display correct tab selection', () => {
    render(<MakeDrawer {...defaultProps} isOpen={true} />)
    
    // Desktop version has tabs
    if (window.innerWidth > 768) {
      const imageSourceTab = screen.getByRole('button', { name: /image source/i })
      expect(imageSourceTab).toHaveClass('border-current')
    }
  })

  it('should pass correct props to SourceSelector', () => {
    render(<MakeDrawer {...defaultProps} isOpen={true} />)
    
    const sourceSelector = screen.getByTestId('source-selector')
    expect(sourceSelector).toHaveTextContent('Default Library (cms)')
  })
}) 
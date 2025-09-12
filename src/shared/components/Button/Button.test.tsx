import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  test('renders with correct text', () => {
    render(<Button onClick={jest.fn()} disabled={false}>Test Button</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Test Button');
  });

  test('applies primary variant by default', () => {
    render(<Button onClick={jest.fn()} disabled={false}>Test Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn--primary');
  });

  test('applies correct variant class', () => {
    render(<Button variant="secondary" onClick={jest.fn()} disabled={false}>Test Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn--secondary');
  });

  test('applies disabled state', () => {
    render(<Button disabled onClick={jest.fn()}>Test Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled={false}>Test Button</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Test Button</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('applies custom className', () => {
    render(<Button className="custom-class" onClick={jest.fn()} disabled={false}>Test Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  test('renders with loading state', () => {
    render(<Button loading onClick={jest.fn()} disabled={false}>Test Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Cargando...');
  });
});
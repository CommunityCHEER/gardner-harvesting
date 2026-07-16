import React from 'react';
import { render } from '@testing-library/react-native';
import ScreenLogo from '../ScreenLogo';

const mockUseContext = jest.spyOn(React, 'useContext');

describe('ScreenLogo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render with a negative top offset when inset is missing', () => {
    mockUseContext.mockReturnValue(null);

    const { UNSAFE_getByType } = render(<ScreenLogo />);
    const image = UNSAFE_getByType(require('react-native').Image);

    const imageStyle = Array.isArray(image.props.style)
      ? image.props.style.find((style: any) => style?.top !== undefined)
      : image.props.style;

    expect(imageStyle.top).toBe(0);
  });

  test('adds top inset without allowing negative values', () => {
    mockUseContext.mockReturnValue({ top: 20, right: 0, bottom: 0, left: 0 });

    const { UNSAFE_getByType } = render(<ScreenLogo top={-6} />);
    const image = UNSAFE_getByType(require('react-native').Image);

    const imageStyle = Array.isArray(image.props.style)
      ? image.props.style.find((style: any) => style?.top !== undefined)
      : image.props.style;

    expect(imageStyle.top).toBe(14);
  });
});
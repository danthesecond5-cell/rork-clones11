import React from 'react';
import renderer from 'react-test-renderer';
import TestingWatermark from '@/components/TestingWatermark';

describe('TestingWatermark', () => {
  it('renders minimal variant', () => {
    const tree = renderer.create(<TestingWatermark visible={true} variant="minimal" showPulse={false} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders full variant', () => {
    const tree = renderer.create(<TestingWatermark visible={true} variant="full" showPulse={false} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('returns null when not visible', () => {
    const tree = renderer.create(<TestingWatermark visible={false} />).toJSON();
    expect(tree).toBeNull();
  });

  it('renders fullscreen position with all elements', () => {
    const tree = renderer.create(
      <TestingWatermark
        visible={true}
        position="fullscreen"
        showPulse={false}
        mlSafetyEnabled={true}
        httpsEnforced={true}
        protocolName="TEST-PROTOCOL"
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

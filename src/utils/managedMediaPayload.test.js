import { describe, expect, it } from 'vitest';

import { withNewManagedImage } from './managedMediaPayload';

describe('withNewManagedImage', () => {
  it('omits an unchanged signed preview URL from edit payloads', () => {
    expect(withNewManagedImage({
      title: 'Updated title',
      image: '/api/media/content/short-lived-token',
    })).toEqual({ title: 'Updated title' });
  });

  it('includes only a newly uploaded stable storage key', () => {
    expect(withNewManagedImage(
      {
        title: 'Updated title',
        image: '/api/media/content/short-lived-token',
      },
      'uploads/owner/workouts/new-image.jpg',
    )).toEqual({
      title: 'Updated title',
      image: 'uploads/owner/workouts/new-image.jpg',
    });
  });
});

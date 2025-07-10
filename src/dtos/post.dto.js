export const formatPostResponse = (post) => ({
    postId: post.id,
    musicalId: post.musical.id,
    musicalTitle: post.musical.title,
    watchDate: post.watch_date,
    watchTime: post.watch_time,
    seat: {
      locationId: post.seat.location_id,
      row: post.seat.row,
      column: post.seat.column,
      seatType: post.seat.seat_type
    },
    content: post.content,
    imageUrls: post.images.map(img => img.url)
  });
  
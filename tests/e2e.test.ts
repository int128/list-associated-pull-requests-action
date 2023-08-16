test('e2e_default_body', () => {
  // https://github.com/int128/list-associated-pull-requests-action/pull/98
  expect(process.env.e2e_default_body).toBe(`\
### Others
- #97 @renovate
- #90 @renovate
- #96 @int128
- #91 @int128
- #89 @int128
- #88 @int128
- #87 @int128
- #86 @renovate
- #85 @renovate
- #84 @renovate
- #83 @renovate
- #82 @renovate
- #81 @renovate
- #80 @renovate
- #79 @renovate
- #78 @int128
- #77 @int128
- #76 @int128
- #75 @int128
- #74 @renovate
- #73 @int128
- #70 @int128
- #71 @renovate
- #69 @int128
- #68 @int128
- #67 @renovate`)
})

test('e2e_with_group_body', () => {
  // https://github.com/int128/list-associated-pull-requests-action/pull/98
  expect(process.env.e2e_with_group_body).toBe(`\
### src
- #89 @int128
- #88 @int128
- #87 @int128
- #78 @int128
- #76 @int128
- #75 @int128
- #70 @int128
- #69 @int128
- #68 @int128
### .github
- #96 @int128
- #91 @int128
- #87 @int128
- #78 @int128
- #70 @int128
### Others
- #97 @renovate
- #90 @renovate
- #86 @renovate
- #85 @renovate
- #84 @renovate
- #83 @renovate
- #82 @renovate
- #81 @renovate
- #80 @renovate
- #79 @renovate
- #77 @int128
- #74 @renovate
- #73 @int128
- #71 @renovate
- #67 @renovate`)
})

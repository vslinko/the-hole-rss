FROM docker-registry.vslinko.xyz/vslinko/nodejs:latest as builder
ADD . /the-hole-rss
WORKDIR /the-hole-rss
RUN npm ci

FROM docker-registry.vslinko.xyz/vslinko/nodejs:latest
COPY --from=builder /the-hole-rss /the-hole-rss
WORKDIR /the-hole-rss
EXPOSE 3000/tcp
VOLUME /the-hole-rss/cache
ENTRYPOINT ["node", "index.mjs"]

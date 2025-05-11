FROM node:22-alpine

WORKDIR	/app

# run apk --no-cache add bash

# add `/app/node_modules/.bin` to $PATH
ENV PATH=/app/node_modules/.bin:$PATH

ENV NODE_ENV='production'

# Install dependencies
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install --frozen-lockfile --prod

COPY dist/ /app/
COPY myConfig.yaml /app/config.yaml

# CMD ["/bin/bash"]
CMD ["node", "server.js", "--config", "config.yaml"]

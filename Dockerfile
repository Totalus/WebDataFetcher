FROM node:16-alpine

WORKDIR	/app

run apk --no-cache add bash

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

ENV NODE_ENV 'production'

# Install dependencies
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install --frozen-lockfile

COPY dist/ /app/

EXPOSE 80

# CMD ["/bin/bash"]
CMD ["node", "server.js"]

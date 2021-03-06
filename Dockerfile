FROM node:8.9.1-slim 
ARG BUILD_BRANCH=develop
ARG NODE=production
RUN apt-get update -qq && \
    apt-get install -y build-essential python git libusb-1.0-0 libusb-1.0-0-dev gcc-4.8 g++-4.8 && \
    mkdir -p /usr/src/app && \
    git clone -b ${BUILD_BRANCH} https://github.com/ChronoBank/ChronoMint.git /usr/src/app && \
    echo ${BUILD_BRANCH}
 
WORKDIR /usr/src/app
RUN yarn
ENV PATH /root/.yarn/bin:$PATH
ENV NODE_ENV ${NODE}
RUN yarn build

FROM nginx:latest
WORKDIR /usr/src/app
COPY --from=0 /usr/src/app .

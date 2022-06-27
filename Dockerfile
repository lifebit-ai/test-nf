FROM continuumio/miniconda3@sha256:456e3196bf3ffb13fee7c9216db4b18b5e6f4d37090b31df3e0309926e98cfe2

LABEL description="Dockerfile for lifebit-ai/gel-mongodb-ingestion" \
      author="ewelina@lifebit.ai, magda@lifebit.ai"

RUN apt-get --allow-releaseinfo-change update -y  \
    && apt-get install -y curl procps gnupg libxt-dev\
    && rm -rf /var/lib/apt/lists/*

COPY environment.yml /
RUN conda env create -f /environment.yml && conda clean -a
ENV PATH /opt/conda/envs/gel-mongodb-ingestion/bin:$PATH

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs

COPY bin/package*.json ./

ENV NODE_OPTIONS=--max_old_space_size=10048
RUN npm install

ENV PATH="$PATH:/opt/bin/"
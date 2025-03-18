FROM rust:1.77-slim as builder

WORKDIR /usr/src/app

# Create a dummy project to cache dependencies
RUN USER=root cargo new --bin triton-adminui
WORKDIR /usr/src/app/triton-adminui
COPY Cargo.toml ./
RUN cargo build --release && \
    rm src/*.rs && \
    rm -rf target/release/deps/triton_adminui*

# Copy the real source code
COPY . .

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install OpenSSL and other necessary libraries
RUN apt-get update && \
    apt-get install -y libssl-dev ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -r triton && useradd -r -g triton triton

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /usr/src/app/triton-adminui/target/release/triton-adminui /app/

# Copy static files for the frontend (assuming they will be added later)
COPY static/ /app/static/

# Use the non-root user
USER triton

# Set environment variables
ENV RUST_LOG=info

# Expose the port
EXPOSE 8080

# Run the binary
CMD ["/app/triton-adminui"]
# LDAPS Authentication Implementation

This document describes the implementation of LDAPS (LDAP Secure) authentication for the Triton AdminUI.

## Overview

The Triton AdminUI now supports direct LDAPS authentication against Triton's UFDS (Unified Foundational Directory Service) using the `ldap3` Rust crate. This allows the application to authenticate users securely without requiring an intermediate API service.

## Implementation Details

### LDAP Connection and Authentication

The authentication process uses the following flow:

1. The `UfdsService` determines if it should use direct LDAP authentication or fallback to HTTP API
2. For LDAP/LDAPS URLs, it connects directly to the LDAP server
3. It binds to the LDAP server using the provided username and password
4. If successful, it retrieves the user attributes from the directory
5. The user information is cached for future use

### LDAP Query Details

- **Base DN**: The LDAP base DN is parsed from the URL or defaults to "o=smartdc"
- **User DN format**: Uses "cn={username},ou=users,{base_dn}"
- **Search filter**: `(&(objectClass=sdcPerson)(cn={username}))`
- **Retrieved attributes**: uuid, email, cn, sn, givenName, memberof, isAdmin

### Async/Blocking Considerations

Since the `ldap3` crate uses synchronous operations, we use Tokio's `spawn_blocking` to perform the LDAP operations in a separate thread to avoid blocking the Actix runtime.

## Configuration

To use LDAPS authentication, set the `UFDS_URL` environment variable to an LDAPS URL:

```
UFDS_URL=ldaps://ufds.your-datacenter.example.com:636
```

For development or testing, you can use:

```
UFDS_URL=ldaps://ufds.us-home.nwhome.local
```

### TLS Certificate Verification

By default, the LDAPS connection will verify TLS certificates. For environments with self-signed certificates, you can disable certificate verification using the environment variable:

```
LDAP_VERIFY_CERTIFICATES=false
```

**Important security note:** Disabling certificate verification should only be done in development environments. In production, proper certificates should be used and verification should be enabled.

## Test Users

In development mode, the following test users are available regardless of the authentication method:

- Username: `admin`, Password: `admin` (administrator role)
- Username: `operator`, Password: `operator` (operator role)

## Fallback Authentication

If the LDAPS connection fails or if the provided URL is an HTTP URL (e.g., for the mock server), the authentication process will fall back to using the HTTP API.

## Error Handling

The authentication process includes detailed error handling and logging for:

- Connection errors
- Binding errors
- Search errors
- Missing attributes

All errors are reported with appropriate context to help diagnose issues.
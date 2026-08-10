package jp.onehr.oneops.platform.proxy;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "oneops.legacy-gateway")
public class LegacyGatewayProperties {

    private boolean enabled;
    private long connectTimeoutMillis = 2_000;
    private long requestTimeoutSeconds = 120;
    private long readinessTimeoutSeconds = 120;
    private String nodeExecutable = "D:\\nginx\\runtime\\node\\node.exe";
    private String nodeScript = "D:\\nginx\\app\\gateway\\server.mjs";
    private String envFile = "D:\\nginx\\app\\.env.local";
    private int internalPort = 8093;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public long getConnectTimeoutMillis() {
        return connectTimeoutMillis;
    }

    public void setConnectTimeoutMillis(long connectTimeoutMillis) {
        this.connectTimeoutMillis = connectTimeoutMillis;
    }

    public long getRequestTimeoutSeconds() {
        return requestTimeoutSeconds;
    }

    public void setRequestTimeoutSeconds(long requestTimeoutSeconds) {
        this.requestTimeoutSeconds = requestTimeoutSeconds;
    }

    public long getReadinessTimeoutSeconds() {
        return readinessTimeoutSeconds;
    }

    public void setReadinessTimeoutSeconds(long readinessTimeoutSeconds) {
        this.readinessTimeoutSeconds = readinessTimeoutSeconds;
    }

    public String getNodeExecutable() {
        return nodeExecutable;
    }

    public void setNodeExecutable(String nodeExecutable) {
        this.nodeExecutable = nodeExecutable;
    }

    public String getNodeScript() {
        return nodeScript;
    }

    public void setNodeScript(String nodeScript) {
        this.nodeScript = nodeScript;
    }

    public String getEnvFile() {
        return envFile;
    }

    public void setEnvFile(String envFile) {
        this.envFile = envFile;
    }

    public int getInternalPort() {
        return internalPort;
    }

    public void setInternalPort(int internalPort) {
        this.internalPort = internalPort;
    }
}

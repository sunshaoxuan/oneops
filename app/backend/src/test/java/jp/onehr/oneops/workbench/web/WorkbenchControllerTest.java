package jp.onehr.oneops.workbench.web;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import jp.onehr.oneops.platform.proxy.LegacyGatewayProxy;

import org.junit.jupiter.api.Test;

class WorkbenchControllerTest {

    @Test
    void dashboardDelegatesToTheBuilderBackedSnapshot() throws Exception {
        LegacyGatewayProxy proxy = mock(LegacyGatewayProxy.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        WorkbenchController controller = new WorkbenchController(proxy);

        controller.dashboard(request, response);

        verify(proxy).forward(request, response);
    }

    @Test
    void eventsDelegatesToTheContinuousBuilderSnapshotStream() throws Exception {
        LegacyGatewayProxy proxy = mock(LegacyGatewayProxy.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        WorkbenchController controller = new WorkbenchController(proxy);

        controller.events(request, response);

        verify(proxy).forward(request, response);
    }
}

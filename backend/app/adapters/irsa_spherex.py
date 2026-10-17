"""
The ONLY file that knows how to talk to the NASA IRSA SIA2 service.
Isolates astroquery and IRSA-specific logic from the rest of the app.
"""
from astropy import units as u
from astropy.coordinates import SkyCoord
from astropy.table import Table
from astroquery.ipac.irsa import Irsa
import requests

from app.utils.errors import (
    ArchiveTimeoutError,
    ArchiveUnavailableError,
    ArchiveResponseError,
)


def search_observations(
    ra: float,
    dec: float,
    radius_deg: float,
    collection: str = "spherex_qr2",
) -> Table:
    """
    Query NASA IRSA for SPHEREx observations.
    Returns a standard Astropy Table.
    """
    try:
        coord = SkyCoord(ra, dec, unit="deg")
        radius = radius_deg * u.deg

        # This is the actual call to NASA
        results = Irsa.query_sia(
            pos=(coord, radius),
            collection=collection,
        )

        # SIA2Results is a wrapper. We convert to a standard Table
        # so the service layer doesn't have to know about pyvo/astroquery quirks.
        table = results.to_table() if hasattr(results, "to_table") else results
        return table

    except requests.exceptions.Timeout:
        raise ArchiveTimeoutError()
    except requests.exceptions.ConnectionError:
        raise ArchiveUnavailableError()
    except Exception as e:
        # Catch-all for other astroquery/IRSA issues
        raise ArchiveResponseError(f"Failed to query IRSA: {str(e)}")
